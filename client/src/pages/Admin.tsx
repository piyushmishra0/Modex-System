import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Calendar, Users, Trash2 } from "lucide-react";
import type { Show } from "@/lib/types";

const createShowSchema = z.object({
  name: z.string().min(1, "Show name is required").max(100, "Name too long"),
  startTime: z.string().min(1, "Start time is required"),
  totalSeats: z.coerce.number().min(1, "At least 1 seat required").max(500, "Maximum 500 seats"),
});

type CreateShowForm = z.infer<typeof createShowSchema>;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("create");
  const { toast } = useToast();

  const form = useForm<CreateShowForm>({
    resolver: zodResolver(createShowSchema),
    defaultValues: {
      name: "",
      startTime: "",
      totalSeats: 40,
    },
  });

  const { data: shows, isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const createShowMutation = useMutation({
    mutationFn: async (data: CreateShowForm) => {
      const response = await apiRequest("POST", "/api/shows", {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      form.reset();
      toast({
        title: "Show created",
        description: "The show has been created successfully.",
      });
      setActiveTab("manage");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create show",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteShowMutation = useMutation({
    mutationFn: async (showId: string) => {
      await apiRequest("DELETE", `/api/shows/${showId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      toast({
        title: "Show deleted",
        description: "The show has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete show",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateShowForm) => {
    createShowMutation.mutate(data);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="container max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage shows, trips, and events.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create" data-testid="tab-create">
            <Plus className="mr-2 h-4 w-4" />
            Create Show
          </TabsTrigger>
          <TabsTrigger value="manage" data-testid="tab-manage">
            <Calendar className="mr-2 h-4 w-4" />
            Manage Shows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Show</CardTitle>
              <CardDescription>
                Add a new show, trip, or event with available seats for booking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show / Trip Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter show name..."
                            className="h-12"
                            data-testid="input-show-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="h-12"
                              min={getMinDateTime()}
                              data-testid="input-start-time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalSeats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Seats</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={500}
                              className="h-12"
                              data-testid="input-total-seats"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full sm:w-auto sm:px-8"
                    disabled={createShowMutation.isPending}
                    data-testid="button-create-show"
                  >
                    {createShowMutation.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Show
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Shows</CardTitle>
              <CardDescription>
                View and manage all created shows and their booking status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <PageLoader text="Loading shows..." />
              ) : !shows || shows.length === 0 ? (
                <EmptyState
                  title="No shows yet"
                  description="Create your first show to start accepting bookings."
                  actionLabel="Create Show"
                  onAction={() => setActiveTab("create")}
                  icon="plus"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead className="text-center">Seats</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shows.map((show) => {
                        const isUpcoming = new Date(show.startTime) > new Date();
                        const availabilityPercent = (show.availableSeats / show.totalSeats) * 100;
                        
                        return (
                          <TableRow key={show.id} data-testid={`row-show-${show.id}`}>
                            <TableCell className="font-medium" data-testid={`cell-name-${show.id}`}>
                              {show.name}
                            </TableCell>
                            <TableCell data-testid={`cell-time-${show.id}`}>
                              <div className="flex flex-col">
                                <span>{format(new Date(show.startTime), "MMM d, yyyy")}</span>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(show.startTime), "h:mm a")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span data-testid={`cell-seats-${show.id}`}>
                                  {show.availableSeats} / {show.totalSeats}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={isUpcoming ? (availabilityPercent > 0 ? "secondary" : "destructive") : "outline"}
                                data-testid={`cell-status-${show.id}`}
                              >
                                {!isUpcoming ? "Ended" : availabilityPercent > 0 ? "Available" : "Sold Out"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteShowMutation.mutate(show.id)}
                                disabled={deleteShowMutation.isPending}
                                data-testid={`button-delete-${show.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
